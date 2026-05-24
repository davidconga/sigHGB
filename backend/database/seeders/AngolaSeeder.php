<?php

namespace Database\Seeders;

use App\Models\Municipio;
use App\Models\Provincia;
use Illuminate\Database\Seeder;

class AngolaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Bengo' => ['Ambriz', 'Bula Atumba', 'Dande', 'Dembos', 'Nambuangongo', 'Pango Aluquém'],
            'Benguela' => ['Baía Farta', 'Balombo', 'Benguela', 'Bocoio', 'Caimbambo', 'Catumbela', 'Chongoroi', 'Cubal', 'Ganda', 'Lobito'],
            'Bié' => ['Andulo', 'Camacupa', 'Catabola', 'Chinguar', 'Chitembo', 'Cuemba', 'Cunhinga', 'Kuito', 'Nharea'],
            'Cabinda' => ['Belize', 'Buco-Zau', 'Cabinda', 'Cacongo'],
            'Cuando-Cubango' => ['Calai', 'Cuangar', 'Cuchi', 'Cuito Cuanavale', 'Dirico', 'Mavinga', 'Menongue', 'Nancova', 'Rivungo'],
            'Cuanza Norte' => ['Ambaca', 'Banga', 'Bolongongo', 'Cambambe', 'Cazengo', 'Golungo Alto', 'Gonguembo', 'Lucala', 'Quiculungo', 'Samba Caju'],
            'Cuanza Sul' => ['Amboim', 'Cassongue', 'Cela', 'Conda', 'Ebo', 'Libolo', 'Mussende', 'Porto Amboim', 'Quibala', 'Quilenda', 'Seles', 'Sumbe'],
            'Cunene' => ['Cahama', 'Cuanhama', 'Curoca', 'Cuvelai', 'Namacunde', 'Ombadja'],
            'Huambo' => ['Bailundo', 'Cachiungo', 'Caála', 'Ekunha', 'Huambo', 'Londuimbali', 'Longonjo', 'Mungo', 'Tchicala-Tcholoanga', 'Tchindjenje', 'Ucuma'],
            'Huíla' => ['Caconda', 'Cacula', 'Caluquembe', 'Chibia', 'Chicomba', 'Chipindo', 'Cuvango', 'Humpata', 'Jamba', 'Lubango', 'Matala', 'Quilengues', 'Quipungo'],
            'Luanda' => ['Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo', 'Luanda', 'Quiçama', 'Talatona', 'Viana'],
            'Lunda Norte' => ['Cambulo', 'Capenda-Camulemba', 'Caungula', 'Chitato', 'Cuango', 'Cuilo', 'Lóvua', 'Lubalo', 'Lucapa', 'Xá-Muteba'],
            'Lunda Sul' => ['Cacolo', 'Dala', 'Muconda', 'Saurimo'],
            'Malanje' => ['Cacuso', 'Calandula', 'Cambundi-Catembo', 'Cangandala', 'Caombo', 'Cuaba Nzogo', 'Cunda-Dia-Baze', 'Kiwaba Nzoji', 'Luquembo', 'Malanje', 'Marimba', 'Massango', 'Mucari', 'Quela'],
            'Moxico' => ['Alto Zambeze', 'Bundas', 'Camanongue', 'Cameia', 'Léua', 'Luacano', 'Luau', 'Luchazes', 'Lumeje', 'Moxico'],
            'Namibe' => ['Bibala', 'Camucuio', 'Moçâmedes', 'Tômbwa', 'Virei'],
            'Uíge' => ['Alto Cauale', 'Ambuíla', 'Bembe', 'Buengas', 'Bungo', 'Damba', 'Maquela do Zombo', 'Milunga', 'Mucaba', 'Negage', 'Puri', 'Quimbele', 'Quitexe', 'Sanza Pombo', 'Songo', 'Uíge'],
            'Zaire' => ['Cuimba', 'Mbanza Kongo', 'Nóqui', 'N\'Zeto', 'Soyo', 'Tomboco'],
        ];

        foreach ($data as $nomeProv => $municipios) {
            $prov = Provincia::firstOrCreate(['nome' => $nomeProv]);
            foreach ($municipios as $nomeMun) {
                Municipio::firstOrCreate(['provincia_id' => $prov->id, 'nome' => $nomeMun]);
            }
        }
    }
}
