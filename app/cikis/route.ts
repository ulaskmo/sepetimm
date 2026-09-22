import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth";
import { siteUrl } from "@/lib/brand";

export async function GET() {
  await endSession();
  redirect("/");
}

export async function POST() {
  await endSession();
  return Response.redirect(`${siteUrl()}/`, 303);
}
