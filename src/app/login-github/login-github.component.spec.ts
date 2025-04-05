import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginGithubComponent } from './login-github.component';

describe('LoginGithubComponent', () => {
  let component: LoginGithubComponent;
  let fixture: ComponentFixture<LoginGithubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginGithubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginGithubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
