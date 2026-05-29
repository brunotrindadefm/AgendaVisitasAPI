export class BusinessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BusinessError';
    }
}

export class ConflictError extends Error {
    public suggestions: string[];
    
    constructor(suggestions: string[]) {
        super('Conflito de horário detectado');
        this.name = 'ConflictError';
        this.suggestions = suggestions;
    }
}