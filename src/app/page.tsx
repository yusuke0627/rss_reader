import { HomeClient } from "@/interface/ui/components/home-client";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center p-8">
      {/* 実操作の入り口は HomeClient に集約 */}
      <HomeClient />
    </main>
  );
}
