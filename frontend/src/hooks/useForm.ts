import { useState } from 'react';
import type { UserInputForm, FormErrors, ValidatedUserInput } from '@/types';
import { TOWNS } from '@/types';
import type { FlatType, Town } from '@/types';

const VALID_FLAT_TYPES: FlatType[] = ['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE', 'MULTI-GENERATION'];

export function useForm() {
  const [form, setForm] = useState<UserInputForm>({
    monthlyIncome: '',
    householdMembers: '',
    flatType: '',
    town: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  function setField<K extends keyof UserInputForm>(key: K, value: UserInputForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): ValidatedUserInput | null {
    const newErrors: FormErrors = {};

    const income = parseFloat(form.monthlyIncome);
    if (!form.monthlyIncome || isNaN(income) || income <= 0) {
      newErrors.monthlyIncome = 'Please enter a valid monthly income greater than 0.';
    }

    const members = parseInt(form.householdMembers, 10);
    if (!form.householdMembers || isNaN(members) || members < 1 || members > 20) {
      newErrors.householdMembers = 'Please enter a valid number of members (1–20).';
    }

    if (!form.flatType || !VALID_FLAT_TYPES.includes(form.flatType as FlatType)) {
      newErrors.flatType = 'Please select a flat type.';
    }

    if (!form.town || !(TOWNS as readonly string[]).includes(form.town)) {
      newErrors.town = 'Please select a town.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return null;

    return {
      monthlyIncome: income,
      householdMembers: members,
      flatType: form.flatType as FlatType,
      town: form.town as Town,
    };
  }

  function reset() {
    setForm({ monthlyIncome: '', householdMembers: '', flatType: '', town: '' });
    setErrors({});
  }

  return { form, errors, setField, validate, reset };
}
