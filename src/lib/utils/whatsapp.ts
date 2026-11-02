import type { VillaWithRelations } from "$lib/server/services/villa.service";

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 4 && hour < 11) {
    return "selamat pagi"; // Good morning (4 AM - 11 AM)
  } else if (hour >= 11 && hour < 15) {
    return "selamat siang"; // Good afternoon (11 AM - 3 PM)
  } else if (hour >= 15 && hour < 18) {
    return "selamat sore"; // Good evening (3 PM - 6 PM)
  } else {
    return "selamat malam"; // Good night (6 PM - 4 AM)
  }
}

export function openWhatsApp(message: string, phoneNumber: string) {
  const _message = encodeURIComponent(message);
  window.open(
    `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${_message}`,
    "_blank",
  );
}

export function openWhatsAppForVilla(villa: VillaWithRelations) {
  const greeting = getTimeBasedGreeting();

  const villaUrl = `${window.location.origin}/villa/${villa.slug}`;
  const message = `Halo ${greeting} kak, saya dapat info dari Villana ${villaUrl} \nApakah masih ada unit tersedia di ${villa.title}?`;

  window.open(
    `https://wa.me/${villa.phoneNumber.replace(/\D/g, "")}?text=${message}`,
    "_blank",
  );
}
