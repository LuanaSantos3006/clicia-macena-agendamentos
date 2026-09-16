"use client";
import {LogOut} from "lucide-react";import {useRouter} from "next/navigation";
export default function LogoutButton(){const router=useRouter();async function logout(){await fetch("/api/admin/logout",{method:"POST"});router.replace("/admin/login");router.refresh()}return <button className="sidebar-logout" onClick={logout}><LogOut size={15}/> Sair</button>}
