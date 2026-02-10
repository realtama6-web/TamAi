export class AIEngine {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = 'openai/gpt-3.5-turbo';
        this.systemPrompt = "Kamu TamAi v3 buatan Tama SDN Cipete Selatan 05. Jawab singkat!";
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
            return data.choices[0].message.content || "Error respon kosong";
        } catch (e) { return "Koneksi mati, Tuan!"; }
    }
}
