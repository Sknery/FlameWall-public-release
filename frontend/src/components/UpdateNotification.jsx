
import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import toast from 'react-hot-toast';

function UpdateNotification() {
  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        updateServiceWorker(true);
      },
      onOfflineReady() {
        toast.success('Application is ready to work offline!', { duration: 5000 });
      }
    });
  }, []);
  return null;
}

export default UpdateNotification;
