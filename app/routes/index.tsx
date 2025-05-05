import type { MetaFunction } from "@remix-run/node";
import { InsuranceChat } from "~/components/chat/InsuranceChat";

export const meta: MetaFunction = () => {
return [
    { title: "Insurance Chat Assistant" },
    { name: "description", content: "Get answers to your insurance questions instantly" },
];
};

export default function Index() {
return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
    <div className="container mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight">
        Insurance Chat Assistant
        </h1>
        <div className="rounded-lg border bg-card shadow">
        <InsuranceChat />
        </div>
    </div>
    </main>
);
}

