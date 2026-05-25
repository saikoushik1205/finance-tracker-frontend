import { ComponentFixture, TestBed } from "@angular/core/testing";

import { InterestComponent } from "./interest.component";

describe("InterestComponent", () => {
  let component: InterestComponent;
  let fixture: ComponentFixture<InterestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InterestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate interest correctly", () => {
    component.transactionForm.principal = 10000;
    component.transactionForm.interestRate = 10;
    component.calculateInterest();
    expect(component.transactionForm.amount).toBe(1000);
  });

  it("should calculate total interest amount", () => {
    component.persons = [
      { _id: "1", name: "Person 1", stats: { total: 5000 } } as any,
      { _id: "2", name: "Person 2", stats: { total: 3000 } } as any,
    ];
    expect(component.getTotalAmount()).toBe(8000);
  });

  it("should calculate total pending interest", () => {
    component.persons = [
      { _id: "1", name: "Person 1", stats: { pending: 2000 } } as any,
      { _id: "2", name: "Person 2", stats: { pending: 1500 } } as any,
    ];
    expect(component.getTotalPending()).toBe(3500);
  });

  it("should calculate total received interest", () => {
    component.persons = [
      { _id: "1", name: "Person 1", stats: { completed: 3000 } } as any,
      { _id: "2", name: "Person 2", stats: { completed: 2500 } } as any,
    ];
    expect(component.getTotalReceived()).toBe(5500);
  });
});
