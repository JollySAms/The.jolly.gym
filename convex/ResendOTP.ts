import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { generateRandomString, RandomReader } from "@oslojs/crypto/random";

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "The Jolly Gym <noreply@jollygym.nl>",
      to: [email],
      subject: `Je inlogcode: ${token}`,
      text: `Je inlogcode voor The Jolly Gym is: ${token}\n\nVoer deze code in op jollygym.nl om in te loggen.`,
    });
    if (error) {
      throw new Error("Kon de e-mail niet versturen");
    }
  },
});
