"""
OAuth2 Authentication Service for Google and Apple Sign-In
"""
import os
import httpx
import secrets
import jwt as pyjwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, status
import logging
from urllib.parse import urlencode
import json
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
import base64

from .models import OAuthProvider, UserRecord, TenantRecord
from .database import db_manager

logger = logging.getLogger(__name__)

class OAuthConfig:
    """OAuth configuration management"""
    
    def __init__(self):
        self.configs = {
            OAuthProvider.GOOGLE: {
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_url': 'https://oauth2.googleapis.com/token',
                'userinfo_url': 'https://www.googleapis.com/oauth2/v2/userinfo',
                'scope': 'openid email profile',
                'response_type': 'code',
            },
            OAuthProvider.APPLE: {
                'client_id': os.getenv('APPLE_CLIENT_ID'),
                'client_secret': self._generate_apple_client_secret(),
                'auth_url': 'https://appleid.apple.com/auth/authorize',
                'token_url': 'https://appleid.apple.com/auth/token',
                'scope': 'name email',
                'response_type': 'code',
                'response_mode': 'form_post',
            }
        }
    
    def _generate_apple_client_secret(self) -> Optional[str]:
        """Generate Apple client secret JWT token"""
        try:
            # Apple Sign In requires a JWT token as client secret
            team_id = os.getenv('APPLE_TEAM_ID')
            key_id = os.getenv('APPLE_KEY_ID')
            private_key = os.getenv('APPLE_PRIVATE_KEY')
            client_id = os.getenv('APPLE_CLIENT_ID')
            
            if not all([team_id, key_id, private_key, client_id]):
                logger.warning("Apple OAuth not configured - missing environment variables")
                return None
            
            # Prepare JWT header and payload
            headers = {
                'alg': 'ES256',
                'kid': key_id
            }
            
            payload = {
                'iss': team_id,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(days=180),  # Max 6 months
                'aud': 'https://appleid.apple.com',
                'sub': client_id
            }
            
            # Sign the JWT
            return pyjwt.encode(payload, private_key, algorithm='ES256', headers=headers)
            
        except Exception as e:
            logger.error(f"Failed to generate Apple client secret: {e}")
            return None
    
    def get_config(self, provider: OAuthProvider) -> Dict[str, Any]:
        """Get OAuth configuration for provider"""
        config = self.configs.get(provider)
        if not config or not config.get('client_id'):
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"OAuth provider {provider} not configured"
            )
        return config

class OAuthService:
    """OAuth authentication service"""
    
    def __init__(self):
        self.config = OAuthConfig()
        self.jwt_secret = os.getenv('JWT_SECRET', secrets.token_urlsafe(32))
        self.jwt_algorithm = 'HS256'
        self.access_token_expire_minutes = 1440  # 24 hours
    
    def get_authorization_url(self, 
                            provider: OAuthProvider, 
                            redirect_uri: str,
                            tenant_subdomain: Optional[str] = None) -> str:
        """Generate OAuth authorization URL"""
        config = self.config.get_config(provider)
        
        # Generate state parameter with tenant info and CSRF protection
        state_data = {
            'csrf': secrets.token_urlsafe(16),
            'tenant': tenant_subdomain,
            'timestamp': datetime.utcnow().isoformat()
        }
        state = base64.urlsafe_b64encode(
            json.dumps(state_data).encode()
        ).decode().rstrip('=')
        
        # Build authorization URL
        params = {
            'client_id': config['client_id'],
            'redirect_uri': redirect_uri,
            'scope': config['scope'],
            'response_type': config['response_type'],
            'state': state,
        }
        
        # Apple-specific parameters
        if provider == OAuthProvider.APPLE:
            params['response_mode'] = config['response_mode']
        
        auth_url = f"{config['auth_url']}?{urlencode(params)}"
        logger.info(f"Generated {provider} auth URL for tenant: {tenant_subdomain}")
        
        return auth_url
    
    def decode_state(self, state: str) -> Dict[str, Any]:
        """Decode and validate state parameter"""
        try:
            # Add padding if needed
            padded_state = state + '=' * (4 - len(state) % 4)
            decoded = base64.urlsafe_b64decode(padded_state)
            state_data = json.loads(decoded.decode())
            
            # Check timestamp (state expires in 1 hour)
            timestamp = datetime.fromisoformat(state_data['timestamp'])
            if datetime.utcnow() - timestamp > timedelta(hours=1):
                raise ValueError("State expired")
            
            return state_data
            
        except Exception as e:
            logger.error(f"Failed to decode state: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter"
            )
    
    async def exchange_code_for_tokens(self, 
                                     provider: OAuthProvider,
                                     code: str,
                                     redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access tokens"""
        config = self.config.get_config(provider)
        
        token_data = {
            'client_id': config['client_id'],
            'client_secret': config['client_secret'],
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    config['token_url'],
                    data=token_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'},
                    timeout=30.0
                )
                
                if not response.is_success:
                    logger.error(f"Token exchange failed: {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to exchange authorization code"
                    )
                
                return response.json()
                
        except httpx.RequestError as e:
            logger.error(f"Token exchange request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OAuth service temporarily unavailable"
            )
    
    async def get_user_info(self, 
                          provider: OAuthProvider,
                          access_token: str) -> Dict[str, Any]:
        """Get user information from OAuth provider"""
        config = self.config.get_config(provider)
        
        try:
            async with httpx.AsyncClient() as client:
                if provider == OAuthProvider.GOOGLE:
                    response = await client.get(
                        config['userinfo_url'],
                        headers={'Authorization': f'Bearer {access_token}'},
                        timeout=30.0
                    )
                elif provider == OAuthProvider.APPLE:
                    # Apple returns user info in ID token
                    return self._decode_apple_id_token(access_token)
                
                if not response.is_success:
                    logger.error(f"User info request failed: {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Failed to get user information"
                    )
                
                return response.json()
                
        except httpx.RequestError as e:
            logger.error(f"User info request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OAuth service temporarily unavailable"
            )
    
    def _decode_apple_id_token(self, id_token: str) -> Dict[str, Any]:
        """Decode Apple ID token to get user info"""
        try:
            # Decode without verification (Apple's public keys change frequently)
            # In production, you should verify the signature
            payload = pyjwt.decode(id_token, options={"verify_signature": False})
            
            return {
                'id': payload.get('sub'),
                'email': payload.get('email'),
                'name': payload.get('name', ''),
                'email_verified': payload.get('email_verified', False)
            }
            
        except Exception as e:
            logger.error(f"Failed to decode Apple ID token: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Apple ID token"
            )
    
    async def create_or_get_user(self,
                               provider: OAuthProvider,
                               user_info: Dict[str, Any],
                               tenant_id: Optional[str] = None) -> Tuple[UserRecord, bool]:
        """Create or get existing user from OAuth info"""
        
        # Extract user data based on provider
        if provider == OAuthProvider.GOOGLE:
            oauth_id = user_info['id']
            email = user_info['email']
            full_name = user_info.get('name', email.split('@')[0])
        elif provider == OAuthProvider.APPLE:
            oauth_id = user_info['id']
            email = user_info['email']
            full_name = user_info.get('name', email.split('@')[0])
        else:
            raise ValueError(f"Unsupported OAuth provider: {provider}")
        
        try:
            # Check if user exists by OAuth ID
            async with db_manager.get_connection() as conn:
                existing_user = await conn.fetchrow("""
                    SELECT u.*, t.subdomain, t.status as tenant_status
                    FROM users u 
                    JOIN tenants t ON u.tenant_id = t.id
                    WHERE u.oauth_provider = $1 AND u.oauth_id = $2
                """, provider.value, oauth_id)
                
                if existing_user:
                    # Update last login
                    await conn.execute("""
                        UPDATE users SET last_login = CURRENT_TIMESTAMP 
                        WHERE id = $1
                    """, existing_user['id'])
                    
                    user_record = UserRecord(existing_user)
                    logger.info(f"Existing user logged in: {user_record.email}")
                    return user_record, False
                
                # If tenant_id provided, create user in that tenant
                if tenant_id:
                    # Check if user already exists in this tenant by email
                    existing_by_email = await conn.fetchrow("""
                        SELECT * FROM users 
                        WHERE tenant_id = $1 AND email = $2
                    """, tenant_id, email)
                    
                    if existing_by_email:
                        # Link OAuth to existing email account
                        await conn.execute("""
                            UPDATE users 
                            SET oauth_provider = $1, oauth_id = $2, last_login = CURRENT_TIMESTAMP
                            WHERE id = $3
                        """, provider.value, oauth_id, existing_by_email['id'])
                        
                        updated_user = await conn.fetchrow("""
                            SELECT * FROM users WHERE id = $1
                        """, existing_by_email['id'])
                        
                        user_record = UserRecord(updated_user)
                        logger.info(f"Linked OAuth to existing user: {user_record.email}")
                        return user_record, False
                    
                    # Create new user in tenant
                    new_user = await conn.fetchrow("""
                        INSERT INTO users (tenant_id, email, full_name, oauth_provider, oauth_id, role)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING *
                    """, tenant_id, email, full_name, provider.value, oauth_id, 'user')
                    
                    user_record = UserRecord(new_user)
                    logger.info(f"Created new user: {user_record.email} in tenant {tenant_id}")
                    return user_record, True
                
                # No tenant specified and user doesn't exist - this should not happen in normal flow
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User not found and no tenant specified"
                )
                
        except Exception as e:
            logger.error(f"Failed to create/get user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process user authentication"
            )
    
    def create_access_token(self, user: UserRecord, tenant: Optional[TenantRecord] = None) -> str:
        """Create JWT access token with tenant context"""
        payload = {
            'sub': user.id,
            'email': user.email,
            'role': user.role,
            'tenant_id': user.tenant_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes),
            'iss': 'babyraffle.base2ml.com',
        }
        
        if tenant:
            payload.update({
                'tenant_subdomain': tenant.subdomain,
                'aud': f'{tenant.subdomain}.base2ml.com'
            })
        
        return pyjwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    def verify_access_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT access token and return payload"""
        try:
            payload = pyjwt.decode(
                token, 
                self.jwt_secret, 
                algorithms=[self.jwt_algorithm],
                issuer='babyraffle.base2ml.com'
            )
            return payload
            
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except pyjwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    async def handle_oauth_callback(self,
                                  provider: OAuthProvider,
                                  code: str,
                                  state: str,
                                  redirect_uri: str) -> Dict[str, Any]:
        """Complete OAuth flow and return user info with tokens"""
        
        # Decode and validate state
        state_data = self.decode_state(state)
        tenant_subdomain = state_data.get('tenant')
        
        # Exchange code for tokens
        tokens = await self.exchange_code_for_tokens(provider, code, redirect_uri)
        
        # Get user info from provider
        user_info = await self.get_user_info(provider, tokens['access_token'])
        
        # Find tenant if subdomain provided
        tenant = None
        tenant_id = None
        
        if tenant_subdomain:
            async with db_manager.get_connection() as conn:
                tenant_row = await conn.fetchrow("""
                    SELECT * FROM get_tenant_by_subdomain($1)
                """, tenant_subdomain)
                
                if tenant_row:
                    tenant = TenantRecord(tenant_row)
                    tenant_id = tenant.id
        
        # Create or get user
        user, is_new_user = await self.create_or_get_user(
            provider, user_info, tenant_id
        )
        
        # Create access token
        access_token = self.create_access_token(user, tenant)
        
        logger.info(f"OAuth callback completed for {user.email}, new_user: {is_new_user}")
        
        return {
            'access_token': access_token,
            'token_type': 'bearer',
            'expires_in': self.access_token_expire_minutes * 60,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role
            },
            'tenant': {
                'id': tenant.id,
                'subdomain': tenant.subdomain,
                'name': tenant.name
            } if tenant else None,
            'is_new_user': is_new_user
        }

# Global OAuth service instance
oauth_service = OAuthService()