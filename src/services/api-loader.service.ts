import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { WindowRef } from './window-ref.service';
import { DocumentRef } from './document-ref.service';

export interface Status {
  loaded: boolean;
  loading: boolean;
  error: boolean;
}

@Injectable()
export class LazyStripeAPILoader {
  private status: BehaviorSubject<Status> = new BehaviorSubject<Status>({
    error: false,
    loaded: false,
    loading: false
  });

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private window: WindowRef,
    private document: DocumentRef
  ) {}

  public asStream(): Observable<Status> {
    this.load();
    return this.status.asObservable();
  }

  public isReady(): boolean {
    return this.status.getValue().loaded;
  }

  public load() {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    const status: Status = this.status.getValue();
    if (this.window.getNativeWindow().hasOwnProperty('Stripe')) {
      this.status.next({
        error: false,
        loaded: true,
        loading: false
      });
    } else if (!status.loaded && !status.loading) {
      this.status.next({
        ...status,
        loading: true
      });

      const script = this.document.getNativeDocument().createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.src = 'https://js.stripe.com/v3/';

      script.onload = () => {
        this.status.next({
          error: false,
          loaded: true,
          loading: false
        });
      };

      script.onerror = () => {
        this.status.next({
          error: true,
          loaded: false,
          loading: false
        });
      };

      this.document.getNativeDocument().body.appendChild(script);
    }
  }
}
