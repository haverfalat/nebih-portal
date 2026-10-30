export interface FormField {
  id: string | null;
  name: string | null;
  label: string;
  type: string;
  value: string;
  required: boolean;
  disabled: boolean;
  checked: boolean;
  options: Array<{ label: string; value: string; selected: boolean }>;
}

export interface PublicForm {
  id: string | null;
  action: string;
  method: string;
  fields: FormField[];
  requiresCaptcha: boolean;
  usesJavaScript: boolean;
}
