import { useCallback, useState } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAPI, useAPIErrorHandler } from '../../hooks/api';
import * as schemas from '../../schemas';
import ErrorAlert from '../ErrorAlert/ErrorAlert';
import LoadingButton from '../LoadingButton/LoadingButton';
import Modal from '../Modal/Modal';
import TenantForm from '../TenantForm/TenantForm';

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (client: schemas.tenant.Tenant) => void;
}

const CreateTenantModal: React.FunctionComponent<React.PropsWithChildren<CreateTenantModalProps>> = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation(['tenants']);
  const api = useAPI();

  const form = useForm<schemas.tenant.TenantCreate>({ defaultValues: { registration_allowed: true } });
  const { handleSubmit, reset, setError } = form;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const handleAPIError = useAPIErrorHandler(setErrorMessage, setError);

  const onSubmit: SubmitHandler<schemas.tenant.TenantCreate> = useCallback(async (data) => {
    setLoading(true);
    try {
      const { data: client } = await api.createTenant(data);
      if (onCreated) {
        onCreated(client);
        reset();
      }
    } catch (err) {
      handleAPIError(err);
    } finally {
      setLoading(false);
    }
  }, [api, onCreated, reset, handleAPIError]);

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton>
            <Modal.Title>{t('create.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              {errorMessage && <ErrorAlert message={t(`common:api_errors.${errorMessage}`)} />}
              <TenantForm update={false} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn-sm border-slate-200 hover:border-slate-300 text-slate-600"
              onClick={() => onClose()}
            >
              {t('create.cancel')}
            </button>
            <LoadingButton
              loading={loading}
              type="submit"
              className="btn-sm bg-primary-500 hover:bg-primary-600 text-white"
            >
              {t('create.submit')}
            </LoadingButton>

          </Modal.Footer>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default CreateTenantModal;
