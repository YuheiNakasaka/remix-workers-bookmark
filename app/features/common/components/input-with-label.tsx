import { useField } from "remix-validated-form";

export function InputWithLabel({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const { error, getInputProps } = useField(name);
  return (
    <div>
      <label htmlFor={name} className="flex w-full flex-col gap-1">
        <span>{label}</span>
        <input
          {...getInputProps({ id: name })}
          defaultValue={defaultValue}
          className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
        />
        {error && <span>{error}</span>}
      </label>
    </div>
  );
}
