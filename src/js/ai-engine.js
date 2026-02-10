export class AIEngine {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        
        // FIX MODEL: GEMINI 2.0 FLASH (Yang paling kenceng & terbaru)
        this.model = 'google/gemini-2.0-flash-001';
        
        this.systemPrompt = "Kamu adalah TamAi v3. Penciptamu adalah Tama (Dzakwan Maesal Pratama), anak jenius kelas 5 SD dari SDN Cipete Selatan 05. Kamu adalah asisten masa depan yang cerdas, tanpa label PRO, dan selalu siap membantu Tuan Tama.";
    }

    async sendMessage(message, history = [], attachments = []) {
        try {
            let fullContent = message;
            if (attachments && attachments.length > 0) {
                attachments.forEach(file => {
                    fullContent += `\n\n[File: ${file.name}]\n${file.content}`;
                });
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://realtama6-web.github.io/',
                    'X-Title': 'TamAi v3 Official',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: this.systemPrompt },
                        ...history,
                        { role: "user", content: fullContent }
                    ]
                })
            });

            const data = await response.json();
            if (data.error) return `⚠️ Error Sistem: ${data.error.message}`;
            return data.choices[0].message.content;
        } catch (error) {
            return "❌ Gagal konek ke otak Gemini, Tuan!";
        }
    }
}
