export function parseOfferNotes(notes: string | null | undefined) {
  if (!notes?.trim()) {
    return { selectionRationale: "", discountJustification: "" };
  }

  let selectionRationale = "";
  let discountJustification = "";

  for (const part of notes.split("\n\n")) {
    if (part.startsWith("Product & service selection:\n")) {
      selectionRationale = part.slice("Product & service selection:\n".length);
    } else if (/^Discount \(\d+(\.\d+)?%\):\n/.test(part)) {
      discountJustification = part.replace(/^Discount \(\d+(\.\d+)?%\):\n/, "");
    } else if (!selectionRationale) {
      selectionRationale = part;
    }
  }

  return { selectionRationale, discountJustification };
}
