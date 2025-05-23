interface Emoji {
	readonly name: string;
	readonly unified: string;
	readonly non_qualified: null | string;
	readonly docomo: null | string;
	readonly au: null | string;
	readonly softbank: null | string;
	readonly google: null | string;
	readonly image: string;
	readonly sheet_x: number;
	readonly sheet_y: number;
	readonly short_name: string;
	readonly short_names: string[];
	readonly text: null | string;
	readonly texts: string[] | null;
	readonly category: Category;
	readonly subcategory: string;
	readonly sort_order: number;
	readonly added_in: string;
	readonly has_img_apple: boolean;
	readonly has_img_google: boolean;
	readonly has_img_twitter: boolean;
	readonly has_img_facebook: boolean;
	readonly skin_variations?: { [key: string]: SkinVariation };
	readonly obsoletes?: string;
	readonly obsoleted_by?: string;
}

const enum Category {
	Activities = "Activities",
	AnimalsNature = "Animals & Nature",
	Component = "Component",
	Flags = "Flags",
	FoodDrink = "Food & Drink",
	Objects = "Objects",
	PeopleBody = "People & Body",
	SmileysEmotion = "Smileys & Emotion",
	Symbols = "Symbols",
	TravelPlaces = "Travel & Places",
}

interface SkinVariation {
	readonly unified: string;
	readonly non_qualified: null | string;
	readonly image: string;
	readonly sheet_x: number;
	readonly sheet_y: number;
	readonly added_in: string;
	readonly has_img_apple: boolean;
	readonly has_img_google: boolean;
	readonly has_img_twitter: boolean;
	readonly has_img_facebook: boolean;
	readonly obsoletes?: string;
	readonly obsoleted_by?: string;
}

export type Emojis = Array<Emoji>;
