// Betting functionality for Pinegrow version
document.addEventListener('DOMContentLoaded', () => {
    const betCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="bet-"]');
    const betCountEl = document.getElementById('bet-count');
    const totalAmountEl = document.getElementById('total-amount');
    const submitButton = document.getElementById('submit-bets');
    const betPrice = 5.00;

    function updateSummary() {
        const selectedBets = Array.from(betCheckboxes).filter(cb => cb.checked);
        const count = selectedBets.length;
        const total = count * betPrice;

        betCountEl.textContent = count;
        totalAmountEl.textContent = `$${total.toFixed(2)}`;
        
        // Enable/disable submit button
        submitButton.disabled = count === 0;
        
        if (count > 0) {
            submitButton.textContent = `Place ${count} Bet${count > 1 ? 's' : ''} - $${total.toFixed(2)} 🎲`;
        } else {
            submitButton.textContent = 'Place Your Bets! 🎲';
        }
    }

    // Add event listeners to all checkboxes
    betCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSummary);
        
        // Also enable/disable associated input fields
        checkbox.addEventListener('change', (e) => {
            const inputId = e.target.id.replace('bet-', '') + '-value';
            const inputField = document.getElementById(inputId);
            if (inputField) {
                inputField.disabled = !e.target.checked;
                inputField.required = e.target.checked;
                
                if (!e.target.checked) {
                    inputField.value = '';
                }
            }
        });
    });

    // Form validation
    function validateForm() {
        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        
        if (!name) {
            alert('Please enter your full name');
            return false;
        }
        
        if (!email) {
            alert('Please enter your email address');
            return false;
        }
        
        // Validate at least one bet is selected with a value
        const selectedBets = Array.from(betCheckboxes).filter(cb => cb.checked);
        if (selectedBets.length === 0) {
            alert('Please select at least one betting category');
            return false;
        }
        
        // Validate all selected bets have values
        for (let checkbox of selectedBets) {
            const inputId = checkbox.id.replace('bet-', '') + '-value';
            const inputField = document.getElementById(inputId);
            if (inputField && !inputField.value.trim()) {
                alert(`Please enter your prediction for ${checkbox.id.replace('bet-', '').replace('-', ' ')}`);
                inputField.focus();
                return false;
            }
        }
        
        return true;
    }

    // Submit form
    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Collect form data
        const formData = {
            name: document.getElementById('user-name').value.trim(),
            email: document.getElementById('user-email').value.trim(),
            phone: document.getElementById('user-phone').value.trim(),
            bets: []
        };
        
        // Collect selected bets
        betCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const category = checkbox.id.replace('bet-', '');
                const inputId = category + '-value';
                const inputField = document.getElementById(inputId);
                
                formData.bets.push({
                    category: category.replace('-', '_'),
                    value: inputField ? inputField.value.trim() : '',
                    amount: betPrice
                });
            }
        });
        
        // In a real app, this would submit to the API
        // For Pinegrow demo, show success message
        showSuccessMessage(formData);
    });

    function showSuccessMessage(data) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4">
                <div class="text-center">
                    <div class="text-green-500 text-6xl mb-4">🎉</div>
                    <h3 class="text-2xl font-bold mb-4">Bets Placed Successfully!</h3>
                    <div class="space-y-2 mb-6 text-left">
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Total Bets:</strong> ${data.bets.length}</p>
                        <p><strong>Total Amount:</strong> $${(data.bets.length * betPrice).toFixed(2)}</p>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg mb-6">
                        <h4 class="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                        <p class="text-blue-800 text-sm">Send $${(data.bets.length * betPrice).toFixed(2)} via Venmo to <strong>@Margo-Jones</strong></p>
                        <p class="text-blue-700 text-sm mt-1">Include "${data.name} - Baby Raffle" in the note</p>
                    </div>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Got it! 👍
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Reset form
        setTimeout(() => {
            document.querySelector('form')?.reset();
            betCheckboxes.forEach(cb => cb.checked = false);
            updateSummary();
        }, 500);
    }

    // Initialize
    updateSummary();
});
