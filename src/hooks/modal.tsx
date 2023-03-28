import { useSite } from "./site";

export const useModal = () => {
  const { modal, setModal } = useSite();
  return { modal, setModal };
};
