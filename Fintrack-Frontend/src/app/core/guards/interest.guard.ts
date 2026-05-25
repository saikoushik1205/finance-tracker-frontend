import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map } from "rxjs/operators";

export const interestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkInterestAccess().pipe(
    map((response: any) => {
      if (response.success && response.hasAccess) {
        return true;
      }
      router.navigate(["/dashboard"]);
      return false;
    })
  );
};
