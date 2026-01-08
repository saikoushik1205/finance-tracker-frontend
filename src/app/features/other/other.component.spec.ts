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
    component.cashBalance = 5000;
    component.bankBalance = 10000;
    expect(component.getTotalBalance()).toBe(15000);
  });

  it("should calculate cash percentage correctly", () => {
    component.cashBalance = 3000;
    component.bankBalance = 7000;
    expect(component.getCashPercentage()).toBe(30);
  });

  it("should calculate bank percentage correctly", () => {
    component.cashBalance = 4000;
    component.bankBalance = 6000;
    expect(component.getBankPercentage()).toBe(60);
  });

  it("should handle zero total balance", () => {
    component.cashBalance = 0;
    component.bankBalance = 0;
    expect(component.getCashPercentage()).toBe(0);
    expect(component.getBankPercentage()).toBe(0);
  });
});
