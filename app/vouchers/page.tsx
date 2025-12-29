import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VouchersClient from './VouchersClient';

export default async function VouchersPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <VouchersClient user={user} />;
}
