
uth #!/bin/bash

# 🚀 Deploy FastAPI to AWS EC2 (Traditional approach)
# Creates EC2 instance and deploys Docker container

set -e

echo "🚀 Deploy FastAPI to AWS EC2"
echo "============================="

# Configuration
AWS_REGION="us-east-1"
INSTANCE_TYPE="t3.micro"
KEY_NAME="baby-raffle-key"
SECURITY_GROUP_NAME="baby-raffle-sg"
DOMAIN="api.margojones.base2ml.com"

echo "Region: $AWS_REGION"
echo "Instance Type: $INSTANCE_TYPE"
echo ""

# 1. Create key pair if it doesn't exist
echo "1. Setting up key pair..."
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $AWS_REGION > /dev/null 2>&1; then
    aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text --region $AWS_REGION > $KEY_NAME.pem
    chmod 400 $KEY_NAME.pem
    echo "✅ Key pair created: $KEY_NAME.pem"
else
    echo "✅ Key pair already exists"
fi

# 2. Create security group
echo "2. Setting up security group..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)

if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME --region $AWS_REGION > /dev/null 2>&1; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group --group-name $SECURITY_GROUP_NAME --description "Baby Raffle API Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text --region $AWS_REGION)
    
    # Allow HTTP, HTTPS, and SSH
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
    aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region $AWS_REGION
    
    echo "✅ Security group created: $SECURITY_GROUP_ID"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME --query "SecurityGroups[0].GroupId" --output text --region $AWS_REGION)
    echo "✅ Security group already exists: $SECURITY_GROUP_ID"
fi

# 3. Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
yum update -y
yum install -y docker

# Start Docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'
services:
  api:
    image: public.ecr.aws/docker/library/python:3.11-slim
    ports:
      - "80:8000"
    environment:
      - DB_HOST=margojones-babyraffle-db.cu1y2a26idsb.us-east-1.rds.amazonaws.com
      - DB_PORT=5432
      - DB_NAME=babyraffle
      - DB_USERNAME=postgres
      - DB_PASSWORD=YgrzO9oHQScN5ctXcTOL
    volumes:
      - ./app:/app
    working_dir: /app
    command: >
      sh -c "
        pip install fastapi uvicorn psycopg2-binary pydantic python-multipart &&
        python -c \"
import os
with open('main.py', 'w') as f:
    f.write('''
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import psycopg2.extras
import os
from datetime import datetime

app = FastAPI(title=\"Baby Raffle API\")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[\"*\"],
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

DB_CONFIG = {
    \"host\": os.getenv(\"DB_HOST\"),
    \"port\": int(os.getenv(\"DB_PORT\", \"5432\")),
    \"database\": os.getenv(\"DB_NAME\"),
    \"user\": os.getenv(\"DB_USERNAME\"),
    \"password\": os.getenv(\"DB_PASSWORD\"),
    \"sslmode\": \"disable\"
}

class Bet(BaseModel):
    categoryKey: str
    betValue: str
    amount: float

class BetSubmission(BaseModel):
    userName: str
    userEmail: str
    userPhone: Optional[str] = None
    bets: List[Bet]

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.get(\"/\")
async def root():
    return {\"message\": \"Baby Raffle API\", \"status\": \"running\"}

@app.get(\"/health\")
async def health():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(\"SELECT 1\")
        cur.close()
        conn.close()
        return {\"status\": \"healthy\"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=\"Database connection failed\")

@app.get(\"/stats\")
async def get_stats():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute(\"SELECT COUNT(*) as count FROM bets\")
        total_bets = cur.fetchone()[\"count\"]
        
        cur.execute(\"\"\"
            SELECT 
                bc.category_key, 
                bc.display_name, 
                COUNT(b.id) as bet_count, 
                COALESCE(SUM(b.amount::numeric), 0) as total_amount 
            FROM bet_categories bc 
            LEFT JOIN bets b ON bc.category_key = b.category_key 
            GROUP BY bc.category_key, bc.display_name
            ORDER BY bc.category_key
        \"\"\")
        
        categories = cur.fetchall()
        total_pot = sum(float(cat[\"total_amount\"]) for cat in categories)
        max_prize = total_pot / 2
        
        cur.close()
        conn.close()
        
        return {
            \"categories\": [
                {
                    \"category_key\": cat[\"category_key\"],
                    \"display_name\": cat[\"display_name\"],
                    \"bet_count\": int(cat[\"bet_count\"]),
                    \"total_amount\": f\"{float(cat[\"total_amount\"]):.2f}\"
                }
                for cat in categories
            ],
            \"totalPot\": f\"{total_pot:.2f}\",
            \"totalBets\": total_bets,
            \"maxPrize\": f\"{max_prize:.2f}\"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == \"__main__\":
    import uvicorn
    uvicorn.run(app, host=\"0.0.0.0\", port=8000)
''')
\" &&
        uvicorn main:app --host 0.0.0.0 --port 8000
      "
    restart: unless-stopped
COMPOSE_EOF

# Set ownership
chown -R ec2-user:ec2-user /home/ec2-user/app

# Start the application
docker-compose up -d

EOF

# 4. Launch EC2 instance
echo "3. Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data file://user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=baby-raffle-api}]" \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region $AWS_REGION)

echo "✅ Instance launched: $INSTANCE_ID"

# 5. Wait for instance to be running
echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION

# 6. Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region $AWS_REGION)

echo ""
echo "✅ Instance is running!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "SSH: ssh -i $KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo ""

# 7. Wait for application to start
echo "Waiting for application to start (this may take 5-10 minutes)..."
sleep 300

echo "Testing API..."
if curl -f http://$PUBLIC_IP/health > /dev/null 2>&1; then
    echo "✅ API is responding!"
else
    echo "⚠️  API not yet ready, check logs: ssh -i $KEY_NAME.pem ec2-user@$PUBLIC_IP 'docker-compose -f /home/ec2-user/app/docker-compose.yml logs'"
fi

# 8. Update Route 53
echo "4. Setting up DNS..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='base2ml.com.'].Id" --output text | cut -d'/' -f3)

if [ ! -z "$HOSTED_ZONE_ID" ]; then
    cat > change-batch.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DOMAIN",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "$PUBLIC_IP"
          }
        ]
      }
    }
  ]
}
EOF

    aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://change-batch.json
    echo "✅ DNS record created: $DOMAIN -> $PUBLIC_IP"
else
    echo "⚠️  Route 53 hosted zone not found"
fi

# Cleanup
rm -f user-data.sh change-batch.json

echo ""
echo "🎉 EC2 Deployment Complete!"
echo "=========================="
echo "Instance: $INSTANCE_ID"
echo "IP: $PUBLIC_IP"
echo "API: http://$PUBLIC_IP/health"
echo "Domain: http://$DOMAIN/health (once DNS propagates)"
echo ""
echo "SSH Access: ssh -i $KEY_NAME.pem ec2-user@$PUBLIC_IP"
