<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {

        User::firstOrCreate(
            ['email' => 'pic.external@brin.go.id'],
            [
                'name'           => 'PIC Eksternal / Umum',
                'password'       => Hash::make('password'),
                'research_group' => 'Unassigned',
                'role'           => 'researcher'
            ]
        );

        $users = [
            ['name'=>'Muh. Hafizh Izzaturrahim, S.Kom.','research_group'=>'Information Retrieval'],
            ['name'=>'Andria Arisal, M. Eng.','research_group'=>'Information Retrieval'],
            ['name'=>'Dr. Dipl.(FH) Ing Asril, M.Sc','research_group'=>'Natural Language Processing'],
            ['name'=>'Dr. Deden Sumirat Hidayat, M.Kom.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Niken Fitria Apriani, S.Kom., M.Kom.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Nuraisa Novia Hidayati, S.Kom., M.Kom.','research_group'=>'Natural Language Processing'],
            ['name'=>'Elvira Nurfadhilah, S.Komp., M. Kom','research_group'=>'Natural Language Processing'],
            ['name'=>'Yaniasih, S.TP., M.P.','research_group'=>'Natural Language Processing'],
            ['name'=>'M. Yudhi Rezaldi, Ph.D','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Abdurrakhman Prasetyadi, M.P','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Dr. Rini Wijayanti, S.Kom., M.Kom.','research_group'=>'Natural Language Processing'],
            ['name'=>'Dr. Purnomo Husnul Khotimah, M.T','research_group'=>'Information Retrieval'],
            ['name'=>'Wawan Hendriawan Nur, S.Si., M.T.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Dr. Foni Agus Setiawan, M.Kom.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Dr. Eng. Ir Yuyun, S.Kom., M.T','research_group'=>'Natural Language Processing'],
            ['name'=>'Ir. Andi Djalal Latief, M.S.','research_group'=>'Natural Language Processing'],
            ['name'=>'Dr. Kokoy Siti Komariah S.Kom., M.T., M.Eng.','research_group'=>'Natural Language Processing'],
            ['name'=>'Dian Isnaeni Nurul Afra, S.Kom., M.T.I.','research_group'=>'Natural Language Processing'],
            ['name'=>'Arafat Febriandirza, Ph.D','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Andre Sihombing S.Kom., M.Sc.','research_group'=>'Information Retrieval'],
            ['name'=>'Rio Nurtantyana','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Gita Citra Puspita S.Kom','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Satrio Adi Priyambada','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Dr. Eng. Lia Sadita, S.Kom, M.Eng','research_group'=>'Information Retrieval'],
            ['name'=>'Dr. Esa Prakasa, MT','research_group'=>'Human Computer Interaction and Visualisation','role'=>'head'],
            ['name'=>'Dra. Andrari Grahitandaru M.Sc.','research_group'=>'Digital Government'],
            ['name'=>'Hengki Muradi, M.Si.','research_group'=>'Digital Government'],
            ['name'=>'Dr. Wiwin Suwarningsih, M.T.','research_group'=>'Information Retrieval'],
            ['name'=>'Dr. Ira Maryati, S.TP,. M.P.','research_group'=>'Information Retrieval'],
            ['name'=>'Dr. Arya Adhyaksa Waskita, M.Si','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Dr. Eng. Budi Nugroho','research_group'=>'Digital Government'],
            ['name'=>'Rezzy Eko Caraka ,S.Si.,M.Sc(RES).,PhD.','research_group'=>'Digital Government'],
            ['name'=>'Dr. Tr. Lindung Parningotan Manik','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Slamet Riyanto, S.Kom., M.M.S.I.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Hayuning Titi Karsanti S. Kom., M.Eng','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Ariani Indrawati, M.TI','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Dadan Ridwan Saleh, M.T.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Nimas Ayu Untariyati, S.Kom, M.T.I','research_group'=>'Digital Government'],
            ['name'=>'Prof. Dr. Ana Hadiana, M.Eng.Sc.','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Ridwan Suhud, M.T','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Al Hafiz Akbar Maulana Siagian, Ph.D.','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Dr. M. Teduh Uliniansyah','research_group'=>'Natural Language Processing'],
            ['name'=>'Ir. Tri Sampurno, M.Sc','research_group'=>'Natural Language Processing'],
            ['name'=>'Retno Anggreini Dyah Ayuningtias, S.Kom','research_group'=>'Digital Government'],
            ['name'=>'Sopian Amir, S.Kom','research_group'=>'Digital Government'],
            ['name'=>'Siti Shaleha, S.ST','research_group'=>'Natural Language Processing'],
            ['name'=>'Prof Nazlena','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Prof Usagawa','research_group'=>'Knowledge and Data Engineering'],
            ['name'=>'Prof Hwang','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>"Iftitahu Ni'mah, S.Kom., M.I.T.",'research_group'=>'Natural Language Processing'],
            ['name'=>'Rifani Bhakti Natari','research_group'=>'Information Retrieval'],
            ['name'=>'Prabu Kresna Putra, S.T., M.T.I.','research_group'=>'Natural Language Processing'],
            ['name'=>'Ekawati Marlina, S.T., M.T.','research_group'=>'Digital Government'],
            ['name'=>'Dr. Ambar Yoganingrum','research_group'=>'Human Computer Interaction and Visualisation'],
            ['name'=>'Dr. DIPL. ING (FH) Anne Parlina, M.P.','research_group'=>'Information Retrieval'],
            ['name'=>'Mochammad Fikri, S.Kom','research_group'=>'Digital Government'],
        ];

        foreach ($users as $u) {
            User::firstOrCreate(
                ['email' => strtolower(preg_replace('/[^a-z0-9]/','',str_replace(' ','.',explode(',',$u['name'])[0]))) . '@BRIN.co.id'],
                [
                    'name'            => $u['name'],
                    'password'        => Hash::make('d'),
                    'research_group'  => $u['research_group'] ?? null,
                    'role'            => $u['role'] ?? 'researcher',
                ]
            );
        }

        User::firstOrCreate(
            ['email' => 'monev@BRIN.co.id'],
            [
                'name'           => 'Monev User',
                'password'       => Hash::make('d'),
                'research_group' => 'Testing Group',
                'role'           => 'monev',
            ]
        );

        User::firstOrCreate(
            ['email' => 'head@BRIN.co.id'],
            [
                'name'           => 'Head User',
                'password'       => Hash::make('d'),
                'research_group' => 'Testing Group',
                'role'           => 'head',
            ]
        );

        User::firstOrCreate(
            ['email' => 'researcher@BRIN.co.id'],
            [
                'name'           => 'Researcher User',
                'password'       => Hash::make('d'),
                'research_group' => 'Testing Group',
                'role'           => 'researcher',
            ]
        );

        User::firstOrCreate(
            ['email' => 'superadmin@BRIN.co.id'],
            [
                'name'           => 'Superadmin User',
                'password'       => Hash::make('d'),
                'research_group' => 'Testing Group',
                'role'           => 'superadmin',
            ]
        );
    }
}
