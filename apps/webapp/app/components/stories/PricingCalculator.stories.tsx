import type { Meta, StoryObj } from "@storybook/react";
import { PricingCalculator } from "../billing/PricingCalculator";
import { RunsVolumeDiscountTable } from "../billing/RunsVolumeDiscountTable";

const meta: Meta<typeof Calculator> = {
  title: "Billing/PricingCalculator",
  component: Calculator,
};

export default meta;

type Story = StoryObj<typeof Calculator>;

export const BillingCalculator: Story = {
  render: (args) => <Calculator />,
};

function Calculator() {
  return (
    <div className="m-12 flex h-screen flex-col items-center justify-center gap-4">
      <div className="flex w-full rounded-md border border-border p-6">
        <PricingCalculator />
        <div className="mx-6 h-full w-px bg-border" />
        <RunsVolumeDiscountTable />
      </div>
      <div className="flex w-full rounded-md border border-border p-6">
        <PricingCalculator />
      </div>
      <div className="flex w-fit rounded-md border border-border p-6">
        <RunsVolumeDiscountTable />
      </div>
    </div>
  );
}