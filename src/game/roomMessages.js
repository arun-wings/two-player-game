const roomErrors = {
  "invalid-name": "Enter a name for the match (up to 20 characters).",
  "invalid-code": "Enter a valid 4-digit room code.",
  "room-not-found": "No room found with that code. Check the code and try again.",
  "room-full": "That room already has two players.",
  "already-in-room": "You are already in a room. Leave it before creating or joining another.",
  "rooms-unavailable": "A room could not be created right now. Please try again.",
  "server-unavailable": "The game server is unavailable. Check your connection and try again.",
};

export function getRoomErrorMessage(error) {
  return roomErrors[error] ?? "Something went wrong. Please try again.";
}
