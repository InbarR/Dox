import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  makeStyles,
  Text,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useDocStore } from '../store/useDocStore';
import { format } from 'date-fns';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    flex: 1,
  },
  current: {
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#E8A31722',
    color: '#E8A317',
    fontSize: '13px',
  },
});

export function ReminderDialog() {
  const styles = useStyles();
  const reminderDialogDocId = useDocStore((s) => s.reminderDialogDocId);
  const setReminderDialogDocId = useDocStore((s) => s.setReminderDialogDocId);
  const setReminder = useDocStore((s) => s.setReminder);
  const docs = useDocStore((s) => s.docs);

  const doc = docs.find((d) => d.id === reminderDialogDocId);

  const now = new Date();
  const defaultDate = format(now, 'yyyy-MM-dd');
  const defaultTime = format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm');

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  const handleClose = () => {
    setReminderDialogDocId(null);
  };

  const handleSet = () => {
    if (!reminderDialogDocId || !date || !time) return;
    const reminderDate = new Date(`${date}T${time}`);
    setReminder(reminderDialogDocId, reminderDate.toISOString());
    handleClose();
  };

  const handleClear = () => {
    if (!reminderDialogDocId) return;
    setReminder(reminderDialogDocId, undefined);
    handleClose();
  };

  return (
    <Dialog open={!!reminderDialogDocId} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={handleClose}
            />
          }
        >
          Set Reminder
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.form}>
              {doc && (
                <Text weight="semibold" size={400}>
                  {doc.title}
                </Text>
              )}

              {doc?.reminder && (
                <div className={styles.current}>
                  Current reminder: {format(new Date(doc.reminder), 'PPp')}
                </div>
              )}

              <div className={styles.row}>
                <Field label="Date" className={styles.field}>
                  <Input
                    type="date"
                    value={date}
                    onChange={(_, data) => setDate(data.value)}
                    appearance="filled-darker"
                  />
                </Field>
                <Field label="Time" className={styles.field}>
                  <Input
                    type="time"
                    value={time}
                    onChange={(_, data) => setTime(data.value)}
                    appearance="filled-darker"
                  />
                </Field>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            {doc?.reminder && (
              <Button appearance="secondary" onClick={handleClear}>
                Clear Reminder
              </Button>
            )}
            <Button appearance="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSet}>
              Set Reminder
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
