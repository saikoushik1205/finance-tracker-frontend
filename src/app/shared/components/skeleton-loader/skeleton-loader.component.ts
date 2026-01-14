import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container">
      <div *ngFor="let item of items" class="skeleton-item">
        <div class="skeleton-line" [style.width]="width"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      padding: 1rem;
    }

    .skeleton-item {
      margin-bottom: 1rem;
    }

    .skeleton-line {
      height: 20px;
      background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-line {
        animation: none;
      }
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() count: number = 3;
  @Input() width: string = '100%';

  get items(): any[] {
    return Array(this.count).fill(0);
  }
}
