import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OtherComponent } from "./other.component";

describe("OtherComponent", () => {
  let component: OtherComponent;
  let fixture: ComponentFixture<OtherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OtherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate total balance correctly", () => {
    component.amazonPayAccounts = [{ name: "Amazon", balance: 5000 }];
    component.bankAccounts = [{ name: "Bank", balance: 10000 }];
    component.tideAccounts = [];
    expect(component.getTotalBalance()).toBe(15000);
  });

  it("should calculate Amazon Pay percentage correctly", () => {
    component.amazonPayAccounts = [{ name: "Amazon", balance: 3000 }];
    component.bankAccounts = [{ name: "Bank", balance: 7000 }];
    component.tideAccounts = [];
    expect(component.getGroupPercentage("amazonPayAccounts")).toBe(30);
  });

  it("should calculate bank percentage correctly", () => {
    component.amazonPayAccounts = [{ name: "Amazon", balance: 4000 }];
    component.bankAccounts = [{ name: "Bank", balance: 6000 }];
    component.tideAccounts = [];
    expect(component.getGroupPercentage("bankAccounts")).toBe(60);
  });

  it("should handle zero total balance", () => {
    component.amazonPayAccounts = [];
    component.bankAccounts = [];
    component.tideAccounts = [];
    expect(component.getGroupPercentage("amazonPayAccounts")).toBe(0);
    expect(component.getGroupPercentage("bankAccounts")).toBe(0);
  });
});
