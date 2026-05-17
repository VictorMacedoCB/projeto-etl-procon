import sqlite3
import os
import sys

def main():
    if len(sys.argv) < 3:
        print("Uso: python init_db.py <db_path> <schema_path>")
        sys.exit(1)
        
    db_path = sys.argv[1]
    schema_path = sys.argv[2]
    
    print(f"Inicializando banco: {db_path}")
    print(f"Usando schema: {schema_path}")
    
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    try:
        conn = sqlite3.connect(db_path)
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn.executescript(schema_sql)
        conn.commit()
        conn.close()
        print("Banco de dados inicializado com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar o banco: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
