import { renderHook, act } from '@testing-library/react';
import useNotifications from '../hooks/useNotifications';

describe('useNotifications', () => {
  it('exposes requestPermission and playTone', async () => {
    // JSDOM doesn't implement Notification; mock it
    // @ts-ignore
    global.Notification = {
      permission: 'default',
      requestPermission: () => Promise.resolve('granted'),
    };

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      const p = await result.current.requestPermission();
      expect(['granted', 'denied', 'default']).toContain(p);
    });

    act(() => {
      result.current.playTone();
    });
  });
});
