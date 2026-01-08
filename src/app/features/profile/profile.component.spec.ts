import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProfileComponent } from "./profile.component";

describe("ProfileComponent", () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should get initials from display name", () => {
    component.user = { displayName: "John Doe" };
    expect(component.getInitials()).toBe("JD");
  });

  it("should get first character from email if no display name", () => {
    component.user = { email: "test@example.com" };
    expect(component.getInitials()).toBe("T");
  });

  it("should detect interest access for special email", () => {
    component.user = { email: "koushiksai242@gmail.com" };
    expect(component.hasInterestAccess()).toBe(true);
  });

  it("should not grant interest access for other emails", () => {
    component.user = { email: "other@example.com" };
    expect(component.hasInterestAccess()).toBe(false);
  });

  it("should get provider name correctly", () => {
    expect(component.getProviderName("google.com")).toBe("Google");
    expect(component.getProviderName("password")).toBe("Email/Password");
    expect(component.getProviderName("phone")).toBe("Phone Number");
  });
});
