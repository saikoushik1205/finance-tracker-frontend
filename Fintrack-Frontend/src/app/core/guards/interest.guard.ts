import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map } from "rxjs/operators";

export const interestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem("interest_unlocked") === "1"
  ) {
    return true;
  }

  return authService.checkInterestAccess().pipe(
    map((response: any) => {
      if (response.success && response.hasAccess) {
        return true;
      }
      router.navigate(["/dashboard"]);
      return false;
    }),
  );
};
