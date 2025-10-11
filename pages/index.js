import { SnackbarProvider } from "notistack";
import HomePage from "@/components/Home";

export default function Home() {
  return (
    <SnackbarProvider preventDuplicate>
      <div>
        <HomePage />
      </div>
    </SnackbarProvider>
  )
}
