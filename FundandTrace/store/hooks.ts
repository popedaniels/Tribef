import { useDispatch } from "react-redux";
import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";

export type AppDispatch = ThunkDispatch<any, any, AnyAction>;

export const useAppDispatch: () => AppDispatch = useDispatch;
