"use client";
import { FormEvent } from "react";
import SyncUser from "@/components/SyncUser";
import { useEffect, useState } from "react";

export default function ExpireAndDamage() {
  const [catagory, setCatagory] = useState("select one");
  const [name, setName] = useState("");
  const { isLoaded, token, isSignedIn, username } = SyncUser();

  //fucntion handler
  async function sendreport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded || !token) {
      return;
    }
    try {
      const reportedby = username?.firstName;
      const senddata = await fetch(
        "http://localhost:3433/nexen/expanddmg/expire",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            catagory: catagory,
            name: name,
            reportedby: reportedby,
          }),
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="outer-box flex flex-col gap-3 px-2 py-2 items-center ">
      <form
        onSubmit={sendreport}
        className="flex gap-2 flex-col justify-center"
      >
        <label>
          Catagory:
          <select
            value={catagory}
            onChange={(e) => setCatagory(e.target.value)}
          >
            <option>select one</option>
            <option> drinks </option>
            <option> cold drinks </option>
            <option> dry foods </option>
          </select>
        </label>

        <label>
          <input
            type="text"
            placeholder="enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <button className="btn btn-ghost" type="submit">
          Submit{" "}
        </button>
      </form>
    </div>
  );
}
