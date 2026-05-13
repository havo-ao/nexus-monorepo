import { AppService } from './app.service';

describe('AppService', () => {
  it('returns the default greeting', () => {
    expect(new AppService().getHello()).toBe('Hello World!');
  });
});
