import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { interestGuard } from "./core/guards/interest.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/dashboard",
    pathMatch: "full",
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "lending",
    loadComponent: () =>
      import("./features/lending/lending.component").then(
        (m) => m.LendingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "borrowing",
    loadComponent: () =>
      import("./features/borrowing/borrowing.component").then(
        (m) => m.BorrowingComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "earnings",
    loadComponent: () =>
      import("./features/earnings/earnings.component").then(
        (m) => m.EarningsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "expenses",
    loadComponent: () =>
      import("./features/expenses/expenses.component").then(
        (m) => m.ExpensesComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "interest",
    loadComponent: () =>
      import("./features/interest/interest.component").then(
        (m) => m.InterestComponent
      ),
    canActivate: [authGuard, interestGuard],
  },
  {
    path: "other",
    loadComponent: () =>
      import("./features/other/other.component").then((m) => m.OtherComponent),
    canActivate: [authGuard],
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./features/profile/profile.component").then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: "**",
    redirectTo: "/dashboard",
  },
];
