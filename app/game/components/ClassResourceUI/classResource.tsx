import { useEffect, useState } from "react";
import styles from "./resource.module.css"
import { specializationColors } from "../../utils/uiUtils";

type Specialization = keyof typeof specializationColors;

type ClassResource = {
    class: Specialization;
    name: string;
    amount: number;
}

export default function ClassResourceUI() {
    const [classResource, setClassResource] = useState<ClassResource | null>(null);

    useEffect(() => {
        const handleClassUpdate = (e: Event) => {
            const event = e as CustomEvent<{ class: string, name: string, amount: number }>;
            setClassResource(event.detail);
        };

        window.addEventListener("class-resource-update", handleClassUpdate);

        return () => {
            window.removeEventListener("class-resource-update", handleClassUpdate);
        };
    }, []);

    return (
        classResource && (
            <div className={styles.classResourceWrapper}>
                <p>{classResource.name}</p>
                <div className={styles.classResourceContainer}>
                    <p>{classResource.amount}</p>
                    <div className={styles.classResourceAmount} style={{ width: `calc(100% * ${classResource.amount / 100})`, background: `${specializationColors[classResource.class].color}` }}></div>
                </div>
            </div>
        )
    )
}