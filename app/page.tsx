import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  const isConnected =
    !error ||
    error.name === "AuthSessionMissingError" ||
    error.message === "Auth session missing!";

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Khidma Platform
        </h1>

        <p className="mt-4 text-gray-600">
          {isConnected
            ? user
              ? "Supabase Connected — User Authenticated"
              : "Supabase Connected Successfully — No User Logged In"
            : "Supabase Connection Error"}
        </p>
      </div>
    </main>
  );
}