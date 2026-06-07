export const kenyaCounties = ['Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang’a','Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'];
export const subjects = ['Mathematics','English','Kiswahili','Science','Coding','Robotics','Creative Arts','Social Studies','Business','Agriculture'];
export function formatKes(value: number) { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value); }
export function isKenyanPhone(value: string) { return /^(?:\+254|254|0)?7\d{8}$/.test(value.replace(/\s+/g, '')); }
export function learnerAgeGroup(age: number) { return age <= 12 ? 'junior' : 'senior'; }
export function safeError(message = 'Something went wrong. Please try again.') { return message.replace(/[<>]/g, ''); }

export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, '').replace(/\u0000/g, '').trim();
}
export function seoTitle(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 70);
}
