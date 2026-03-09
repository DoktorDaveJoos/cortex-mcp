export interface CortexSettings {
	port: number;
	autoStart: boolean;
}

export const DEFAULT_SETTINGS: CortexSettings = {
	port: 27182,
	autoStart: true,
};
