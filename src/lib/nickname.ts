// Nicknames chosen at email sign-up work as @handles on scoreboards and team names.
// They are unique regardless of case; the API checks it (the database does not yet).
export const NICKNAME_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;
export const NICKNAME_RULE = "Use 3–20 letters, digits, _ or - for your nickname.";
export const NICKNAME_TAKEN = "That nickname is taken.";
