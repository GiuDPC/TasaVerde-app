import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
  },
});

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  // Imports lazy para evitar crash al cargar el modulo
  const AuthSession = require("expo-auth-session");
  const WebBrowser = require("expo-web-browser");

  WebBrowser.maybeCompleteAuthSession();

  const redirectUrl = AuthSession.makeRedirectUri({ scheme: "tasaverde" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No auth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === "success") {
    const url = result.url;
    // Parsear tokens del fragment manualmente (React Native no tiene URL API)
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) return;

    const fragment = url.substring(hashIndex + 1);
    const params: Record<string, string> = {};
    fragment.split("&").forEach((pair: string) => {
      const [key, value] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });

    const accessToken = params["access_token"];
    const refreshToken = params["refresh_token"];

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}