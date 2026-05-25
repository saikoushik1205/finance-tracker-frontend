import { ComponentFixture, TestBed } from '@angular/core/testing';
import { borrowingComponent } from './borrowing.component';

describe('borrowingComponent', () => {
  let component: borrowingComponent;
  let fixture: ComponentFixture<borrowingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [borrowingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(borrowingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

