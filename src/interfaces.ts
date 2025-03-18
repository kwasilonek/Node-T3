export interface User {
    id: number,
    username: string,
}

export interface CreatedExerciseResponse {
	exerciseId: number;
	date: string;
	userId: number;
	duration: number;
	description: string;
}

export interface Exercise {
	id: number;
	description: string;
	duration: number;
	date: string;
}

export interface Exercise {
	id: number;
	description: string;
	duration: number;
	date: string;
}

export interface UserExerciseLog extends User {
	logs: Exercise[];
	count: number;
}