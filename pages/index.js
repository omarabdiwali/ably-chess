import { SnackbarProvider } from "notistack";
import HomePage from "@/utils/home/Home";

export default function Home() {
  return (
    <SnackbarProvider preventDuplicate>
      <div>
        <HomePage />
      </div>
    </SnackbarProvider>
  )
}
