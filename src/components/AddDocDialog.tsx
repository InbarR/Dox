import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  Select,
  makeStyles,
  Field,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { DocType, DocSource, TYPE_LABELS, SOURCE_LABELS } from '../types';
import { useDocStore } from '../store/useDocStore';
import { detectTypeFromUrl, detectSourceFromUrl } from '../utils/fileIcons';

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
});

export function AddDocDialog() {
  const styles = useStyles();
  const addDialogOpen = useDocStore((s) => s.addDialogOpen);
  const setAddDialogOpen = useDocStore((s) => s.setAddDialogOpen);
  const addDoc = useDocStore((s) => s.addDoc);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<DocType>('doc');
  const [source, setSource] = useState<DocSource>('sharepoint');
  const [sharedBy, setSharedBy] = useState('');

  const reset = () => {
    setTitle('');
    setUrl('');
    setType('doc');
    setSource('sharepoint');
    setSharedBy('');
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.startsWith('http')) {
      setType(detectTypeFromUrl(value));
      setSource(detectSourceFromUrl(value));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    addDoc({
      title: title.trim(),
      url: url.trim(),
      type,
      source,
      sharedBy: sharedBy.trim(),
    });
    reset();
    setAddDialogOpen(false);
  };

  const handleClose = () => {
    reset();
    setAddDialogOpen(false);
  };

  return (
    <Dialog open={addDialogOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
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
          Add Document
        </DialogTitle>
        <DialogBody>
          <DialogContent>
            <div className={styles.form}>
              <Field label="URL" hint="Paste a SharePoint, OneDrive, or other document link">
                <Input
                  value={url}
                  onChange={(_, data) => handleUrlChange(data.value)}
                  placeholder="https://..."
                  appearance="filled-darker"
                />
              </Field>

              <Field label="Title" required>
                <Input
                  value={title}
                  onChange={(_, data) => setTitle(data.value)}
                  placeholder="Document name"
                  appearance="filled-darker"
                />
              </Field>

              <div className={styles.row}>
                <Field label="Type" className={styles.field}>
                  <Select
                    value={type}
                    onChange={(_, data) => setType(data.value as DocType)}
                    appearance="filled-darker"
                  >
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Source" className={styles.field}>
                  <Select
                    value={source}
                    onChange={(_, data) => setSource(data.value as DocSource)}
                    appearance="filled-darker"
                  >
                    {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Shared By">
                <Input
                  value={sharedBy}
                  onChange={(_, data) => setSharedBy(data.value)}
                  placeholder="Person who shared this"
                  appearance="filled-darker"
                />
              </Field>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={!title.trim()}>
              Add Document
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
