"use client";

import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/client";
import IronSword from "@/app/game/assets/weapons/great_sword/iron_sword.png";
import { LoginForm } from "./game/components/login/login";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./providers/AuthProvider";
import { redirect } from "next/navigation";
import Link from "next/link";
import {ChevronRightIcon} from "@heroicons/react/24/solid"

export default function Home() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [username, setUsername] = useState("");

  const { logout } = useAuth();

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Failed to get authenticated user:", authError.message);
        setAuthLoaded(true);
        return;
      }

      setUser(user);

      if (user) {
        await getUserData(user.id);
      } else {
        setUsername("");
      }

      setAuthLoaded(true);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authenticatedUser = session?.user ?? null;

      setUser(authenticatedUser);
      setAuthLoaded(true);

      if (authenticatedUser) {
        void getUserData(authenticatedUser.id);
      } else {
        setUsername("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function getUserData(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("uid", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load user data:", error.message);
      return;
    }

    if (!data) {
      console.error("No users table row exists for:", userId);
      return;
    }

    setUsername(data.username);
  }

  return (
    <main className={styles.main}>
      <h1>MONCRA</h1>
      <div className={styles.playBtnContainer}>
        {!authLoaded ? (
          <p>Checking authentication...</p>
        ) : user ? (
          <>
              <div
                className={styles.playBtn}
                onClick={() => {
                  window.location.href = "/game";
                }}
              >
                <div className={styles.playBtnLeft}>
                  <div className={styles.statusLight}></div>
                  <p>{username}</p>
                </div>
                <div className={styles.playBtnRight}>
                  <p>Play</p>
                  <ChevronRightIcon className={styles.arrowRightIcon} />
                </div>
              </div>
              <button className={styles.logoutBtn} onClick={() => void logout()}>Log out</button>
          </>
        ) : (
          <>
            <p>Login to play</p>

            <button
              className={styles.openLoginBtn}
              type="button"
              onClick={() => setLoginOpen(true)}
            >
              Login
            </button>
          </>
        )}
      </div>

      <img
        className={styles.leftSword}
        src={IronSword.src}
        alt=""
      />

      <img
        className={styles.rightSword}
        src={IronSword.src}
        alt=""
      />

      <div className={styles.bgLightLeft} />
      <div className={styles.bgLightRight} />

      <LoginForm
        setLoginOpen={setLoginOpen}
        loginOpen={loginOpen}
      />
    </main>
  );
}