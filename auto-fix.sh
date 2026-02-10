#!/bin/bash

echo "🚀 Memulai Proses Full Auto TamAi v3..."

# 1. Benerin Tampilan (Biar pas di HP & Gak Lag)
echo "📱 Mengoptimalkan tampilan layar HP..."
sed -i '/<head>/a \    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' index.html

# 2. Benerin Otak AI (GPT-3.5 Turbo + SDN Cipete Selatan 05)
echo "🧠 Mengupdate Otak AI ke GPT-3.5 Turbo..."
cat > src/js/ai-engine.js << 'INNEREOF'
export class AIEngine {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = 'openai/gpt-3.5-turbo';
        this.systemPrompt = "Kamu adalah TamAi v3. Penciptamu adalah Tama (Dzakwan Maesal Pratama) dari SDN Cipete Selatan 05. Jawab dengan gaya asisten yang sangat cerdas, singkat, dan keren!";
    }

    async sendMessage(message, history = []) {
        try {
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{role:"system", content:this.systemPrompt}, ...history, {role:"user", content:message}]
                })
            });
            const data = await res.json();
            return data.choices[0].message.content;
        } catch (e) {
            return "⚠️ Waduh Tuan Tama, sistem lagi gangguan. Cek koneksi!";
        }
    }
}
INNEREOF

# 3. Jalankan Gas.sh Otomatis
echo "📤 Mengirim pembaruan ke GitHub..."
chmod +x gas.sh
./gas.sh

echo "✅ SEMUA BERES, TUAN TAMA! Silakan cek web di Tab Penyamaran."
